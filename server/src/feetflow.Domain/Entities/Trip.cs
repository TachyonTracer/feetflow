using feetflow.Domain.Enums;

namespace feetflow.Domain.Entities;

public class Trip
{
    public Guid Id { get; set; }
    public Guid? VehicleId { get; set; }
    public Guid? DriverId { get; set; }
    public decimal CargoWeightKg { get; set; }
    public decimal? StartOdometer { get; set; }
    public decimal? EndOdometer { get; set; }
    public decimal? Revenue { get; set; }
    public TripStatus Status { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public uint Xmin { get; set; }
}
