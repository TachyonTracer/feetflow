using MediatR;
using feetflow.Domain.Common;
using feetflow.Domain.Entities;
using feetflow.Domain.Enums;
using feetflow.Domain.Interfaces;
using FluentValidation;

namespace feetflow.Application.Features.FleetFlow.Trips;

public record CompleteTripCommand(Guid TripId, decimal EndOdometer, decimal Revenue) : IRequest<Result<Trip>>;

public class CompleteTripCommandValidator : AbstractValidator<CompleteTripCommand>
{
    public CompleteTripCommandValidator()
    {
        RuleFor(x => x.TripId).NotEmpty();
        RuleFor(x => x.EndOdometer).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Revenue).GreaterThanOrEqualTo(0);
    }
}

public class CompleteTripCommandHandler : IRequestHandler<CompleteTripCommand, Result<Trip>>
{
    private readonly ITripRepository _tripRepository;
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IDriverRepository _driverRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CompleteTripCommandHandler(
        ITripRepository tripRepository,
        IVehicleRepository vehicleRepository,
        IDriverRepository driverRepository,
        IUnitOfWork unitOfWork)
    {
        _tripRepository = tripRepository;
        _vehicleRepository = vehicleRepository;
        _driverRepository = driverRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Trip>> Handle(CompleteTripCommand request, CancellationToken cancellationToken)
    {
        var trip = await _tripRepository.GetByIdAsync(request.TripId, cancellationToken);
        if (trip == null)
            return Result<Trip>.NotFound("Trip not found.");
        if (trip.Status != TripStatus.Dispatched)
            return Result<Trip>.Failure("Only dispatched trips can be completed.", 400);

        var startOdometer = trip.StartOdometer ?? 0m;
        if (request.EndOdometer <= startOdometer)
        {
            return Result<Trip>.Failure("End odometer must be greater than start odometer.", 400);
        }

        if (!trip.VehicleId.HasValue || !trip.DriverId.HasValue)
        {
            return Result<Trip>.Failure("Trip has no vehicle or driver.", 400);
        }

        var vehicle = await _vehicleRepository.GetByIdAsync(trip.VehicleId.Value, cancellationToken);
        var driver = await _driverRepository.GetByIdAsync(trip.DriverId.Value, cancellationToken);
        if (vehicle == null || driver == null)
        {
            return Result<Trip>.Failure("Vehicle or driver not found.", 400);
        }

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var completedAt = DateTime.UtcNow;
            var tripUpdated = await _tripRepository.UpdateStatusAsync(request.TripId, TripStatus.Completed, trip.Xmin, request.EndOdometer, request.Revenue, completedAt, cancellationToken);
            if (tripUpdated == 0)
            {
                await _unitOfWork.RollbackAsync(cancellationToken);
                return Result<Trip>.Conflict("Trip was modified by another user.");
            }

            var vehicleUpdated = await _vehicleRepository.SetOdometerAndStatusAsync(trip.VehicleId.Value, request.EndOdometer, VehicleStatus.Available, vehicle.Xmin, cancellationToken);
            if (vehicleUpdated == 0)
            {
                await _unitOfWork.RollbackAsync(cancellationToken);
                return Result<Trip>.Conflict("Vehicle was modified by another user.");
            }

            var driverUpdated = await _driverRepository.SetStatusAsync(trip.DriverId.Value, DriverStatus.OnDuty, driver.Xmin, cancellationToken);
            if (driverUpdated == 0)
            {
                await _unitOfWork.RollbackAsync(cancellationToken);
                return Result<Trip>.Conflict("Driver was modified by another user.");
            }

            await _unitOfWork.CommitAsync(cancellationToken);

            trip.Status = TripStatus.Completed;
            trip.EndOdometer = request.EndOdometer;
            trip.Revenue = request.Revenue;
            trip.CompletedAt = completedAt;
            return Result<Trip>.Success(trip);
        }
        catch
        {
            await _unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
