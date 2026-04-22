using System.ComponentModel.DataAnnotations;

namespace ClinicaPilates.Api.DTOs;

public class CreateUserDto
{
    [Required(ErrorMessage = "O nome é obrigatório.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "O e-mail é obrigatório.")]
    [EmailAddress(ErrorMessage = "Informe um e-mail válido.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "A senha é obrigatória.")]
    [MinLength(6, ErrorMessage = "A senha deve ter no mínimo 6 caracteres.")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "O perfil é obrigatório.")]
    public string Role { get; set; } = "admin";

    public int? StudentId { get; set; }
}