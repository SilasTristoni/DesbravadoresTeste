package br.com.desbravadores.api.model;

import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;

import jakarta.persistence.Column; // IMPORT ADICIONADO
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "backgrounds")
@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")
public class Background {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    // Agora é opcional, só será preenchido se o fundo for uma imagem
    @Column(nullable = true)
    private String imageUrl;

    // Cor do texto para ser usada com este fundo (ex: "#FFFFFF")
    private String textColor;

    // NOVO CAMPO ADICIONADO AQUI
    // Guardará o código CSS para um gradiente (ex: "linear-gradient(#ff0000, #0000ff)")
    @Column(nullable = true)
    private String gradient;

    // Construtor vazio
    public Background() {
    }

    // Getters e Setters (incluindo para o novo campo 'gradient')
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getTextColor() { return textColor; }
    public void setTextColor(String textColor) { this.textColor = textColor; }
    public String getGradient() { return gradient; }
    public void setGradient(String gradient) { this.gradient = gradient; }
}