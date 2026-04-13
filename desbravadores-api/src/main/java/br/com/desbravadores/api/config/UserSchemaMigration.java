package br.com.desbravadores.api.config;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.Statement;

import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class UserSchemaMigration {

    private static final Logger log = LoggerFactory.getLogger(UserSchemaMigration.class);

    @Bean
    ApplicationRunner migrateUsernameColumn(DataSource dataSource) {
        return args -> {
            try (Connection connection = dataSource.getConnection()) {
                if (!isMySql(connection) || !hasTable(connection, "users")) {
                    return;
                }

                boolean hasEmailColumn = hasColumn(connection, "users", "email");
                boolean hasUsernameColumn = hasColumn(connection, "users", "username");

                if (!hasEmailColumn) {
                    return;
                }

                try (Statement statement = connection.createStatement()) {
                    if (!hasUsernameColumn) {
                        statement.executeUpdate(
                                "ALTER TABLE users CHANGE COLUMN email username VARCHAR(255) NOT NULL"
                        );
                    } else {
                        statement.executeUpdate(
                                "UPDATE users SET username = email WHERE (username IS NULL OR username = '') AND email IS NOT NULL"
                        );
                        statement.executeUpdate("ALTER TABLE users DROP COLUMN email");
                    }
                }

                log.info("Users table migrated to username-based login");
            }
        };
    }

    private boolean isMySql(Connection connection) throws Exception {
        String productName = connection.getMetaData().getDatabaseProductName();
        return productName != null && productName.toLowerCase().contains("mysql");
    }

    private boolean hasTable(Connection connection, String tableName) throws Exception {
        DatabaseMetaData metaData = connection.getMetaData();
        try (ResultSet resultSet = metaData.getTables(connection.getCatalog(), null, tableName, null)) {
            return resultSet.next();
        }
    }

    private boolean hasColumn(Connection connection, String tableName, String columnName) throws Exception {
        DatabaseMetaData metaData = connection.getMetaData();
        try (ResultSet resultSet = metaData.getColumns(connection.getCatalog(), null, tableName, columnName)) {
            return resultSet.next();
        }
    }
}
