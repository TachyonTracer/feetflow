using feetflow.Domain.Enums;

namespace feetflow.Domain.Entities;

public class Vehicle
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string LicensePlate { get; set; } = string.Empty;
    public string VehicleType { get; set; } = string.Empty;
    public decimal MaxCapacityKg { get; set; }
    public decimal OdometerKm { get; set; }
    public decimal AcquisitionCost { get; set; }
    public VehicleStatus Status { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public uint Xmin { get; set; }
}
