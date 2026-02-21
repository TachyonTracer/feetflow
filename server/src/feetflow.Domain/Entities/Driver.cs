using feetflow.Domain.Enums;

namespace feetflow.Domain.Entities;

public class Driver
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string LicenseNumber { get; set; } = string.Empty;
    public string LicenseCategory { get; set; } = string.Empty;
    public DateOnly LicenseExpiry { get; set; }
    public decimal CompletionRate { get; set; } = 100.00m;
    public decimal SafetyScore { get; set; } = 100.00m;
    public int Complaints { get; set; } = 0;
    public DriverStatus Status { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public uint Xmin { get; set; }
}
