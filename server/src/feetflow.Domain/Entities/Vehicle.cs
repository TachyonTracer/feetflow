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

    // Transient properties from active trips
    public string? ActiveTripOriginState { get; set; }
    public string? ActiveTripDestinationState { get; set; }

    // Transient operational cost properties
    public decimal? TotalFuelCost { get; set; }
    public decimal? TotalMaintenanceCost { get; set; }
    public decimal? TotalMiscExpense { get; set; }
    public decimal TotalOperationalCost => (TotalFuelCost ?? 0) + (TotalMaintenanceCost ?? 0) + (TotalMiscExpense ?? 0);

    public VehicleStatus Status { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public uint Xmin { get; set; }
}
