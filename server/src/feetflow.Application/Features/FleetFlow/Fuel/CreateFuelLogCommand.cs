using MediatR;
using feetflow.Domain.Common;
using feetflow.Domain.Entities;
using feetflow.Domain.Interfaces;
using FluentValidation;

namespace feetflow.Application.Features.FleetFlow.Fuel;

public record CreateFuelLogCommand(
    Guid VehicleId, 
    Guid? TripId, 
    Guid? DriverId, 
    decimal Liters, 
    decimal Cost, 
    decimal Distance, 
    decimal MiscExpense, 
    string Status, 
    DateOnly FuelDate) : IRequest<Result<FuelLog>>;

public class CreateFuelLogCommandValidator : AbstractValidator<CreateFuelLogCommand>
{
    public CreateFuelLogCommandValidator()
    {
        RuleFor(x => x.VehicleId).NotEmpty();
        RuleFor(x => x.Liters).GreaterThan(0);
        RuleFor(x => x.Cost).GreaterThanOrEqualTo(0);
        RuleFor(x => x.FuelDate).NotEmpty();
    }
}

public class CreateFuelLogCommandHandler : IRequestHandler<CreateFuelLogCommand, Result<FuelLog>>
{
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IFuelLogRepository _fuelLogRepository;

    public CreateFuelLogCommandHandler(IVehicleRepository vehicleRepository, IFuelLogRepository fuelLogRepository)
    {
        _vehicleRepository = vehicleRepository;
        _fuelLogRepository = fuelLogRepository;
    }

    public async Task<Result<FuelLog>> Handle(CreateFuelLogCommand request, CancellationToken cancellationToken)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(request.VehicleId, cancellationToken);
        if (vehicle == null)
            return Result<FuelLog>.NotFound("Vehicle not found.");

        var log = new FuelLog
        {
            Id = Guid.NewGuid(),
            VehicleId = request.VehicleId,
            TripId = request.TripId,
            DriverId = request.DriverId,
            Liters = request.Liters,
            Cost = request.Cost,
            Distance = request.Distance,
            MiscExpense = request.MiscExpense,
            Status = request.Status,
            FuelDate = request.FuelDate,
            CreatedAt = DateTime.UtcNow
        };
        await _fuelLogRepository.AddAsync(log, cancellationToken);
        return Result<FuelLog>.Created(log);
    }
}
