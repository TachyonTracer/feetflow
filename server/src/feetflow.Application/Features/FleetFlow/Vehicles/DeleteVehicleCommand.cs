using MediatR;
using feetflow.Domain.Common;
using feetflow.Domain.Entities;
using feetflow.Domain.Interfaces;
using FluentValidation;

namespace feetflow.Application.Features.FleetFlow.Vehicles;

public record DeleteVehicleCommand(Guid Id) : IRequest<Result<MediatR.Unit>>;

public class DeleteVehicleCommandValidator : AbstractValidator<DeleteVehicleCommand>
{
    public DeleteVehicleCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
    }
}

public class DeleteVehicleCommandHandler : IRequestHandler<DeleteVehicleCommand, Result<MediatR.Unit>>
{
    private readonly IVehicleRepository _vehicleRepository;

    public DeleteVehicleCommandHandler(IVehicleRepository vehicleRepository)
    {
        _vehicleRepository = vehicleRepository;
    }

    public async Task<Result<MediatR.Unit>> Handle(DeleteVehicleCommand request, CancellationToken cancellationToken)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(request.Id, cancellationToken);
        // GetByIdAsync excludes is_deleted = TRUE; null => not found or soft-deleted => 404
        if (vehicle == null)
            return Result<MediatR.Unit>.NotFound("Vehicle not found.");

        await _vehicleRepository.SoftDeleteAsync(request.Id, cancellationToken);
        return Result<MediatR.Unit>.Success(MediatR.Unit.Value);
    }
}
