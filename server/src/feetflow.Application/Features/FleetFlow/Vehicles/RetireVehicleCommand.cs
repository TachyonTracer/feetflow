using MediatR;
using feetflow.Domain.Common;
using feetflow.Domain.Entities;
using feetflow.Domain.Enums;
using feetflow.Domain.Interfaces;
using FluentValidation;

namespace feetflow.Application.Features.FleetFlow.Vehicles;

public record RetireVehicleCommand(Guid Id) : IRequest<Result<Vehicle>>;

public class RetireVehicleCommandValidator : AbstractValidator<RetireVehicleCommand>
{
    public RetireVehicleCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
    }
}

public class RetireVehicleCommandHandler : IRequestHandler<RetireVehicleCommand, Result<Vehicle>>
{
    private readonly IVehicleRepository _vehicleRepository;

    public RetireVehicleCommandHandler(IVehicleRepository vehicleRepository)
    {
        _vehicleRepository = vehicleRepository;
    }

    public async Task<Result<Vehicle>> Handle(RetireVehicleCommand request, CancellationToken cancellationToken)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(request.Id, cancellationToken);
        if (vehicle == null)
            return Result<Vehicle>.NotFound("Vehicle not found.");
        if (vehicle.Status == VehicleStatus.OnTrip)
            return Result<Vehicle>.Failure("Cannot retire vehicle that is on a trip.", 400);

        var updated = await _vehicleRepository.SetStatusAsync(request.Id, VehicleStatus.Retired, vehicle.Xmin, cancellationToken);
        if (updated == 0)
            return Result<Vehicle>.Conflict("Vehicle was modified by another user.");
        vehicle.Status = VehicleStatus.Retired;
        return Result<Vehicle>.Success(vehicle);
    }
}
