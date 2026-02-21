using MediatR;
using feetflow.Domain.Common;
using feetflow.Domain.Entities;
using feetflow.Domain.Interfaces;
using FluentValidation;

namespace feetflow.Application.Features.FleetFlow.Vehicles;

public record UpdateVehicleCommand(
    Guid Id,
    string Name,
    string LicensePlate,
    string VehicleType,
    decimal MaxCapacityKg,
    decimal OdometerKm,
    decimal AcquisitionCost,
    uint Xmin) : IRequest<Result<Vehicle>>;

public class UpdateVehicleCommandValidator : AbstractValidator<UpdateVehicleCommand>
{
    public UpdateVehicleCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.LicensePlate).NotEmpty().MaximumLength(50);
        RuleFor(x => x.VehicleType).NotEmpty().MaximumLength(50);
        RuleFor(x => x.MaxCapacityKg).GreaterThan(0);
        RuleFor(x => x.OdometerKm).GreaterThanOrEqualTo(0);
        RuleFor(x => x.AcquisitionCost).GreaterThanOrEqualTo(0);
    }
}

public class UpdateVehicleCommandHandler : IRequestHandler<UpdateVehicleCommand, Result<Vehicle>>
{
    private readonly IVehicleRepository _vehicleRepository;

    public UpdateVehicleCommandHandler(IVehicleRepository vehicleRepository)
    {
        _vehicleRepository = vehicleRepository;
    }

    public async Task<Result<Vehicle>> Handle(UpdateVehicleCommand request, CancellationToken cancellationToken)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(request.Id, cancellationToken);
        if (vehicle == null)
            return Result<Vehicle>.NotFound("Vehicle not found.");

        vehicle.Name = request.Name;
        vehicle.LicensePlate = request.LicensePlate;
        vehicle.VehicleType = request.VehicleType;
        vehicle.MaxCapacityKg = request.MaxCapacityKg;
        vehicle.OdometerKm = request.OdometerKm;
        vehicle.AcquisitionCost = request.AcquisitionCost;
        vehicle.Xmin = request.Xmin;

        var updated = await _vehicleRepository.UpdateAsync(vehicle, cancellationToken);
        if (updated == 0)
            return Result<Vehicle>.Conflict("Vehicle was modified by another user.");
        return Result<Vehicle>.Success(vehicle);
    }
}
