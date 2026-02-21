using MediatR;
using feetflow.Domain.Common;
using feetflow.Domain.Entities;
using feetflow.Domain.Enums;
using feetflow.Domain.Interfaces;
using FluentValidation;

namespace feetflow.Application.Features.FleetFlow.Trips;

public record DispatchTripCommand(Guid TripId) : IRequest<Result<Trip>>;

public class DispatchTripCommandValidator : AbstractValidator<DispatchTripCommand>
{
    public DispatchTripCommandValidator()
    {
        RuleFor(x => x.TripId).NotEmpty();
    }
}

public class DispatchTripCommandHandler : IRequestHandler<DispatchTripCommand, Result<Trip>>
{
    private readonly ITripRepository _tripRepository;

    public DispatchTripCommandHandler(ITripRepository tripRepository)
    {
        _tripRepository = tripRepository;
    }

    public async Task<Result<Trip>> Handle(DispatchTripCommand request, CancellationToken cancellationToken)
    {
        var trip = await _tripRepository.GetByIdAsync(request.TripId, cancellationToken);
        if (trip == null)
            return Result<Trip>.NotFound("Trip not found.");
        if (trip.Status != TripStatus.Draft)
            return Result<Trip>.Failure("Only draft trips can be dispatched.", 400);

        var updated = await _tripRepository.UpdateStatusAsync(request.TripId, TripStatus.Dispatched, trip.Xmin, null, null, null, cancellationToken);
        if (updated == 0)
            return Result<Trip>.Conflict("Trip was modified by another user.");

        trip.Status = TripStatus.Dispatched;
        return Result<Trip>.Success(trip);
    }
}
