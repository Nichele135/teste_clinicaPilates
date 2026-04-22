namespace ClinicaPilates.Api.Models;

public class ScheduleSlot
{
    public int Id { get; set; }

    public DayOfWeek DayOfWeek { get; set; }

    public TimeSpan StartTime { get; set; }

    public TimeSpan EndTime { get; set; }

    public int MaxStudents { get; set; } = 4;

    public bool IsActive { get; set; } = true;

    public string Notes { get; set; } = string.Empty;

    public ICollection<ClassSession> ClassSessions { get; set; } = new List<ClassSession>();

    public ICollection<ScheduleSlotOverride> Overrides { get; set; } = new List<ScheduleSlotOverride>();
}