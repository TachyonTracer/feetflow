using MediatR;
using feetflow.Domain.Common;
using feetflow.Domain.Entities;
using feetflow.Domain.Enums;
using feetflow.Domain.Interfaces;
using FluentValidation;

namespace feetflow.Application.Features.FleetFlow.Trips;

public record CreateTripCommand(Guid VehicleId, Guid DriverId, decimal CargoWeightKg, string OriginState, string DestinationState) : IRequest<Result<Trip>>;

public class CreateTripCommandValidator : AbstractValidator<CreateTripCommand>
{
    public CreateTripCommandValidator()
    {
        RuleFor(x => x.VehicleId).NotEmpty();
        RuleFor(x => x.DriverId).NotEmpty();
        RuleFor(x => x.CargoWeightKg).GreaterThan(0);
        RuleFor(x => x.OriginState).NotEmpty().MaximumLength(50);
        RuleFor(x => x.DestinationState).NotEmpty().MaximumLength(50);
    }
}

public class CreateTripCommandHandler : IRequestHandler<CreateTripCommand, Result<Trip>>
{
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IDriverRepository _driverRepository;
    private readonly ITripRepository _tripRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateTripCommandHandler(
        IVehicleRepository vehicleRepository,
        IDriverRepository driverRepository,
        ITripRepository tripRepository,
        IUnitOfWork unitOfWork)
    {
        _vehicleRepository = vehicleRepository;
        _driverRepository = driverRepository;
        _tripRepository = tripRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Trip>> Handle(CreateTripCommand request, CancellationToken cancellationToken)
    {
        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var vehicle = await _vehicleRepository.GetByIdAsync(request.VehicleId, cancellationToken);
            if (vehicle == null)
            {
                await _unitOfWork.RollbackAsync(cancellationToken);
                return Result<Trip>.NotFound("Vehicle not found.");
            }
            if (vehicle.Status != VehicleStatus.Available)
            {
                await _unitOfWork.RollbackAsync(cancellationToken);
                return Result<Trip>.Failure("Vehicle must be available (not on trip or in shop).", 400);
            }

            var driver = await _driverRepository.GetByIdAsync(request.DriverId, cancellationToken);
            if (driver == null)
            {
                await _unitOfWork.RollbackAsync(cancellationToken);
                return Result<Trip>.NotFound("Driver not found.");
            }
            if (driver.Status != DriverStatus.OnDuty)
            {
                await _unitOfWork.RollbackAsync(cancellationToken);
                return Result<Trip>.Failure("Driver must be on duty.", 400);
            }
            if (driver.LicenseExpiry < DateOnly.FromDateTime(DateTime.UtcNow))
            {
                await _unitOfWork.RollbackAsync(cancellationToken);
                return Result<Trip>.Failure("Driver license has expired.", 400);
            }

            if (request.CargoWeightKg > vehicle.MaxCapacityKg)
            {
                await _unitOfWork.RollbackAsync(cancellationToken);
                return Result<Trip>.Failure($"Cargo weight exceeds vehicle max capacity ({vehicle.MaxCapacityKg} kg).", 400);
            }

            var trip = new Trip
            {
                Id = Guid.NewGuid(),
                VehicleId = request.VehicleId,
                DriverId = request.DriverId,
                CargoWeightKg = request.CargoWeightKg,
                OriginState = request.OriginState,
                DestinationState = request.DestinationState,
                StartOdometer = vehicle.OdometerKm,
                Status = TripStatus.Draft,
                CreatedAt = DateTime.UtcNow
            };
            await _tripRepository.AddAsync(trip, cancellationToken);

            var vehicleUpdated = await _vehicleRepository.SetStatusAsync(request.VehicleId, VehicleStatus.OnTrip, vehicle.Xmin, cancellationToken);
            if (vehicleUpdated == 0)
            {
                await _unitOfWork.RollbackAsync(cancellationToken);
                return Result<Trip>.Conflict("Vehicle was modified by another user.");
            }

            var driverUpdated = await _driverRepository.SetStatusAsync(request.DriverId, DriverStatus.OnTrip, driver.Xmin, cancellationToken);
            if (driverUpdated == 0)
            {
                await _unitOfWork.RollbackAsync(cancellationToken);
                return Result<Trip>.Conflict("Driver was modified by another user.");
            }

            await _unitOfWork.CommitAsync(cancellationToken);
            return Result<Trip>.Created(trip);
        }
        catch
        {
            await _unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
