using System.ComponentModel.DataAnnotations;

namespace ClinicaPilates.Api.DTOs;

public class CreateScheduleSlotDto
{
    [Required(ErrorMessage = "O dia da semana é obrigatório.")]
    public DayOfWeek DayOfWeek { get; set; }

    [Required(ErrorMessage = "O horário de início é obrigatório.")]
    public TimeSpan StartTime { get; set; }

    [Required(ErrorMessage = "O horário de fim é obrigatório.")]
    public TimeSpan EndTime { get; set; }

    [Range(1, 5, ErrorMessage = "O número máximo de alunos deve ser entre 1 e 5.")]
    public int? MaxStudents { get; set; }

    public string Notes { get; set; } = string.Empty;
}