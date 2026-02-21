namespace feetflow.Domain.Entities;

public class MaintenanceLog
{
    public Guid Id { get; set; }
    public Guid VehicleId { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Cost { get; set; }
    public DateOnly ServiceDate { get; set; }
    public bool IsClosed { get; set; }
    public DateTime CreatedAt { get; set; }
}
