using MediatR;
using feetflow.Domain.Common;
using feetflow.Domain.Entities;
using feetflow.Domain.Interfaces;
using FluentValidation;

namespace feetflow.Application.Features.FleetFlow.Fuel;

public record UpdateFuelLogCommand(
    Guid Id, 
    Guid VehicleId, 
    Guid? TripId, 
    Guid? DriverId,
    decimal Liters, 
    decimal Cost, 
    decimal Distance,
    decimal MiscExpense,
    string Status,
    DateOnly FuelDate) : IRequest<Result<FuelLog>>;

public class UpdateFuelLogCommandValidator : AbstractValidator<UpdateFuelLogCommand>
{
    public UpdateFuelLogCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.VehicleId).NotEmpty();
        RuleFor(x => x.Liters).GreaterThan(0);
        RuleFor(x => x.Cost).GreaterThanOrEqualTo(0);
        RuleFor(x => x.FuelDate).NotEmpty();
    }
}

public class UpdateFuelLogCommandHandler : IRequestHandler<UpdateFuelLogCommand, Result<FuelLog>>
{
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IFuelLogRepository _fuelLogRepository;

    public UpdateFuelLogCommandHandler(IVehicleRepository vehicleRepository, IFuelLogRepository fuelLogRepository)
    {
        _vehicleRepository = vehicleRepository;
        _fuelLogRepository = fuelLogRepository;
    }

    public async Task<Result<FuelLog>> Handle(UpdateFuelLogCommand request, CancellationToken cancellationToken)
    {
        var log = await _fuelLogRepository.GetByIdAsync(request.Id, cancellationToken);
        if (log == null)
            return Result<FuelLog>.NotFound("Fuel log entry not found.");

        var vehicle = await _vehicleRepository.GetByIdAsync(request.VehicleId, cancellationToken);
        if (vehicle == null)
            return Result<FuelLog>.NotFound("Vehicle not found.");

        log.VehicleId = request.VehicleId;
        log.TripId = request.TripId;
        log.DriverId = request.DriverId;
        log.Liters = request.Liters;
        log.Cost = request.Cost;
        log.Distance = request.Distance;
        log.MiscExpense = request.MiscExpense;
        log.Status = request.Status;
        log.FuelDate = request.FuelDate;

        await _fuelLogRepository.UpdateAsync(log, cancellationToken);
        return Result<FuelLog>.Success(log);
    }
}
