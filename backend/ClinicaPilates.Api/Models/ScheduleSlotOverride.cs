namespace ClinicaPilates.Api.Models;

public class ScheduleSlotOverride
{
    public int Id { get; set; }

    public int ScheduleSlotId { get; set; }
    public ScheduleSlot? ScheduleSlot { get; set; }

    public DateTime Date { get; set; }

    public bool IsActive { get; set; } = true;

    public int? MaxStudents { get; set; }

    public string? Notes { get; set; }
}