namespace ClinicaPilates.Api.Models;

public class Plan
{
    // Id do plano
    public int Id { get; set; }
    // Nome do plano
    public string Name { get; set; } = string.Empty;
    // Periodicidade do plano
    public string Periodicity { get; set; } = string.Empty;
    // Quantidade de aulas por semana
    public int ClassesPerWeek { get; set; }
    // Preço do plano
    public decimal Price { get; set; }
    // Indica se o plano está ativo
    public bool IsActive { get; set; } = true;
    public ICollection<Student> Students { get; set; } = new List<Student>();
}