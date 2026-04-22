namespace ClinicaPilates.Api.Models;

public class Student
{
    public int Id { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    public DateTime? BirthDate { get; set; }

    public DateTime StartDate { get; set; } = DateTime.UtcNow;

    public bool IsActive { get; set; } = true;

    public string Notes { get; set; } = string.Empty;
    
//Relacionamento com User
    public int? UserId { get; set; }
    public User? User { get; set; }

    //planos
    public int? PlanId { get; set; }
    public Plan? Plan { get; set; }

    public ICollection<ClassSessionStudent> ClassSessionStudents { get; set; } = new List<ClassSessionStudent>();

    public ICollection<StudentPayment> Payments { get; set; } = new List<StudentPayment>();
}