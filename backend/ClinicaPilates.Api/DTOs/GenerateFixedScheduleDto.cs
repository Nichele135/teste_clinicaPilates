namespace ClinicaPilates.Api.DTOs;

public class GenerateFixedScheduleDto
{
    public List<DayOfWeek> DaysOfWeek { get; set; } = new();

    public TimeSpan StartTime { get; set; }

    public TimeSpan EndTime { get; set; }

    public int ClassDurationMinutes { get; set; }

    public int BreakMinutes { get; set; }

    public int MaxStudents { get; set; } = 5;

    public string Notes { get; set; } = string.Empty;
}