namespace feetflow.Domain.Entities;

public class FuelLog
{
    public Guid Id { get; set; }
    public Guid VehicleId { get; set; }
    public Guid? TripId { get; set; }
    public decimal Liters { get; set; }
    public decimal Cost { get; set; }
    public DateOnly FuelDate { get; set; }
    public DateTime CreatedAt { get; set; }
}
