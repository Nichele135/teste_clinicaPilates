namespace ClinicaPilates.Api.DTOs.ScheduleSlotOverrides;

public class BlockScheduleRangeDto
{
    public DateTime Date { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public string? Notes { get; set; }
}