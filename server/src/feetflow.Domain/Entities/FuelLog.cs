namespace feetflow.Domain.Entities;

public class FuelLog
{
    public Guid Id { get; set; }
    public Guid VehicleId { get; set; }
    public Guid? TripId { get; set; }
    public Guid? DriverId { get; set; }
    public decimal Liters { get; set; }
    public decimal Cost { get; set; }
    public decimal Distance { get; set; }
    public decimal MiscExpense { get; set; }
    public string Status { get; set; } = "Completed";
    public DateOnly FuelDate { get; set; }
    public DateTime CreatedAt { get; set; }

    // Populated via JOINs
    public string? DriverName { get; set; }
    public string? VehicleName { get; set; }
}
