using System.ComponentModel.DataAnnotations;

namespace ClinicaPilates.Api.DTOs;

public class CreateClassSessionDto
{
    [Required(ErrorMessage = "O horário é obrigatório.")]
    public int ScheduleSlotId { get; set; }

    [Required(ErrorMessage = "A data da aula é obrigatória.")]
    public DateTime ClassDate { get; set; }

    [Required(ErrorMessage = "A data e hora de início são obrigatórias.")]
    public DateTime StartDateTime { get; set; }

    [Required(ErrorMessage = "A data e hora de fim são obrigatórias.")]
    public DateTime EndDateTime { get; set; }
}