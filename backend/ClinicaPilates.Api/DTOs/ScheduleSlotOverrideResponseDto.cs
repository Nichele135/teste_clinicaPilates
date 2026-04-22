namespace ClinicaPilates.Api.DTOs;

public class ScheduleSlotOverrideResponseDto
{
    public int Id { get; set; }
    public int ScheduleSlotId { get; set; }
    public DateTime Date { get; set; }
    public bool IsActive { get; set; }
    public int MaxStudents { get; set; }
    public string? Notes { get; set; }
}