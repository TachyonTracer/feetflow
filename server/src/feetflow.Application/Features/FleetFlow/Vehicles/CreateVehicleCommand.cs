using MediatR;
using feetflow.Domain.Common;
using feetflow.Domain.Entities;
using feetflow.Domain.Enums;
using feetflow.Domain.Interfaces;
using FluentValidation;

namespace feetflow.Application.Features.FleetFlow.Vehicles;

public record CreateVehicleCommand(
    string Name,
    string LicensePlate,
    string VehicleType,
    decimal MaxCapacityKg,
    decimal AcquisitionCost,
    decimal OdometerKm = 0) : IRequest<Result<Vehicle>>;

public class CreateVehicleCommandValidator : AbstractValidator<CreateVehicleCommand>
{
    public CreateVehicleCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.LicensePlate).NotEmpty().MaximumLength(50);
        RuleFor(x => x.VehicleType).NotEmpty().MaximumLength(50);
        RuleFor(x => x.MaxCapacityKg).GreaterThan(0);
        RuleFor(x => x.AcquisitionCost).GreaterThanOrEqualTo(0);
        RuleFor(x => x.OdometerKm).GreaterThanOrEqualTo(0);
    }
}

public class CreateVehicleCommandHandler : IRequestHandler<CreateVehicleCommand, Result<Vehicle>>
{
    private readonly IVehicleRepository _vehicleRepository;

    public CreateVehicleCommandHandler(IVehicleRepository vehicleRepository)
    {
        _vehicleRepository = vehicleRepository;
    }

    public async Task<Result<Vehicle>> Handle(CreateVehicleCommand request, CancellationToken cancellationToken)
    {
        var vehicle = new Vehicle
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            LicensePlate = request.LicensePlate,
            VehicleType = request.VehicleType,
            MaxCapacityKg = request.MaxCapacityKg,
            OdometerKm = request.OdometerKm,
            AcquisitionCost = request.AcquisitionCost,
            Status = VehicleStatus.Available,
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow,
            Xmin = 0
        };
        await _vehicleRepository.AddAsync(vehicle, cancellationToken);
        return Result<Vehicle>.Created(vehicle);
    }
}
