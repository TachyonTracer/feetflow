using MediatR;
using feetflow.Domain.Common;
using feetflow.Domain.Entities;
using feetflow.Domain.Enums;
using feetflow.Domain.Interfaces;
using FluentValidation;

namespace feetflow.Application.Features.FleetFlow.Trips;

public record CancelTripCommand(Guid TripId) : IRequest<Result<Trip>>;

public class CancelTripCommandValidator : AbstractValidator<CancelTripCommand>
{
    public CancelTripCommandValidator()
    {
        RuleFor(x => x.TripId).NotEmpty();
    }
}

public class CancelTripCommandHandler : IRequestHandler<CancelTripCommand, Result<Trip>>
{
    private readonly ITripRepository _tripRepository;
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IDriverRepository _driverRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CancelTripCommandHandler(
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

    public async Task<Result<Trip>> Handle(CancelTripCommand request, CancellationToken cancellationToken)
    {
        var trip = await _tripRepository.GetByIdAsync(request.TripId, cancellationToken);
        if (trip == null)
            return Result<Trip>.NotFound("Trip not found.");
        if (trip.Status == TripStatus.Completed)
            return Result<Trip>.Failure("Completed trips cannot be cancelled.", 400);
        if (trip.Status == TripStatus.Cancelled)
            return Result<Trip>.Success(trip);

        if (trip.Status == TripStatus.Dispatched && trip.VehicleId.HasValue && trip.DriverId.HasValue)
        {
            await _unitOfWork.BeginTransactionAsync(cancellationToken);
            try
            {
                var vehicle = await _vehicleRepository.GetByIdAsync(trip.VehicleId.Value, cancellationToken);
                var driver = await _driverRepository.GetByIdAsync(trip.DriverId.Value, cancellationToken);
                if (vehicle != null)
                    await _vehicleRepository.SetStatusAsync(trip.VehicleId.Value, VehicleStatus.Available, vehicle.Xmin, cancellationToken);
                if (driver != null)
                    await _driverRepository.SetStatusAsync(trip.DriverId.Value, DriverStatus.OnDuty, driver.Xmin, cancellationToken);
                var tripUpdated = await _tripRepository.UpdateStatusAsync(request.TripId, TripStatus.Cancelled, trip.Xmin, null, null, null, cancellationToken);
                if (tripUpdated == 0)
                {
                    await _unitOfWork.RollbackAsync(cancellationToken);
                    return Result<Trip>.Conflict("Trip was modified by another user.");
                }
                await _unitOfWork.CommitAsync(cancellationToken);
                trip.Status = TripStatus.Cancelled;
                return Result<Trip>.Success(trip);
            }
            catch
            {
                await _unitOfWork.RollbackAsync(cancellationToken);
                throw;
            }
        }

        var updated = await _tripRepository.UpdateStatusAsync(request.TripId, TripStatus.Cancelled, trip.Xmin, null, null, null, cancellationToken);
        if (updated == 0)
            return Result<Trip>.Conflict("Trip was modified by another user.");
        trip.Status = TripStatus.Cancelled;
        return Result<Trip>.Success(trip);
    }
}
