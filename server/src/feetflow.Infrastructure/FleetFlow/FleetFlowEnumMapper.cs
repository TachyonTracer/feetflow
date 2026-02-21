using feetflow.Domain.Enums;

namespace feetflow.Infrastructure.FleetFlow;

internal static class FleetFlowEnumMapper
{
    public static string ToDb(VehicleStatus v) => v switch
    {
        VehicleStatus.Available => "available",
        VehicleStatus.OnTrip => "on_trip",
        VehicleStatus.InShop => "in_shop",
        VehicleStatus.Retired => "retired",
        _ => "available"
    };

    public static VehicleStatus ToVehicleStatus(string s) => s switch
    {
        "available" => VehicleStatus.Available,
        "on_trip" => VehicleStatus.OnTrip,
        "in_shop" => VehicleStatus.InShop,
        "retired" => VehicleStatus.Retired,
        _ => VehicleStatus.Available
    };

    public static string ToDb(DriverStatus d) => d switch
    {
        DriverStatus.OnDuty => "on_duty",
        DriverStatus.OnTrip => "on_trip",
        DriverStatus.OffDuty => "off_duty",
        DriverStatus.Suspended => "suspended",
        _ => "on_duty"
    };

    public static DriverStatus ToDriverStatus(string s) => s switch
    {
        "on_duty" => DriverStatus.OnDuty,
        "on_trip" => DriverStatus.OnTrip,
        "off_duty" => DriverStatus.OffDuty,
        "suspended" => DriverStatus.Suspended,
        _ => DriverStatus.OnDuty
    };

    public static string ToDb(TripStatus t) => t switch
    {
        TripStatus.Draft => "draft",
        TripStatus.Dispatched => "dispatched",
        TripStatus.Completed => "completed",
        TripStatus.Cancelled => "cancelled",
        _ => "draft"
    };

    public static TripStatus ToTripStatus(string s) => s switch
    {
        "draft" => TripStatus.Draft,
        "dispatched" => TripStatus.Dispatched,
        "completed" => TripStatus.Completed,
        "cancelled" => TripStatus.Cancelled,
        _ => TripStatus.Draft
    };

    public static string ToDb(UserRole r) => r switch
    {
        UserRole.Manager => "manager",
        UserRole.Dispatcher => "dispatcher",
        UserRole.SafetyOfficer => "safety_officer",
        UserRole.FinancialAnalyst => "financial_analyst",
        _ => "manager"
    };

    public static UserRole ToUserRole(string s) => s switch
    {
        "manager" => UserRole.Manager,
        "dispatcher" => UserRole.Dispatcher,
        "safety_officer" => UserRole.SafetyOfficer,
        "financial_analyst" => UserRole.FinancialAnalyst,
        _ => UserRole.Manager
    };
}
