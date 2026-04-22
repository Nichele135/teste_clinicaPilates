using System.ComponentModel.DataAnnotations;

namespace ClinicaPilates.Api.DTOs;

public class CreateStudentDto
{
    [Required(ErrorMessage = "O nome completo é obrigatório.")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "O telefone é obrigatório.")]
    public string Phone { get; set; } = string.Empty;

    [Required(ErrorMessage = "O e-mail é obrigatório.")]
    [EmailAddress(ErrorMessage = "Informe um e-mail válido.")]
    public string Email { get; set; } = string.Empty;

    public DateTime? BirthDate { get; set; }

    public string Notes { get; set; } = string.Empty;
}