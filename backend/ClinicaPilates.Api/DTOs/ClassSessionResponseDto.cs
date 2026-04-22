namespace ClinicaPilates.Api.DTOs;

public class ClassSessionResponseDto
{
    public int Id { get; set; }

    public int ScheduleSlotId { get; set; }

    public string DayOfWeek { get; set; } = string.Empty;

    public string StartTime { get; set; } = string.Empty;

    public string EndTime { get; set; } = string.Empty;

    public DateTime ClassDate { get; set; }

    public DateTime StartDateTime { get; set; }

    public DateTime EndDateTime { get; set; }

    public string Status { get; set; } = string.Empty;

    public int TotalStudents { get; set; }

    public List<StudentInClassDto> Students { get; set; } = new();
}

public class StudentInClassDto
{
    public int Id { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public string HasMakeupCredit { get; set; } = string.Empty;

    public string EquipmentUsed { get; set; } = string.Empty;

    public string EquipmentNotes { get; set; } = string.Empty;
}