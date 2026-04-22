namespace ClinicaPilates.Api.Models;

public class ClassSessionStudent
{
    public int ClassSessionId { get; set; }
    public ClassSession? ClassSession { get; set; }

    public int StudentId { get; set; }
    public Student? Student { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public string Status { get; set; } = "Booked";

    public bool HasMakeupCredit { get; set; } = false;

    public bool MakeupCreditUsed { get; set; } = false;

    public string EquipmentUsed { get; set; } = string.Empty;

    public string EquipmentNotes { get; set; } = string.Empty;
}