using MediatR;
using feetflow.Domain.Common;
using feetflow.Domain.Entities;
using feetflow.Domain.Enums;
using feetflow.Domain.Interfaces;
using FluentValidation;

namespace feetflow.Application.Features.FleetFlow.Maintenance;

public record CloseMaintenanceCommand(Guid Id) : IRequest<Result<MaintenanceLog>>;

public class CloseMaintenanceCommandValidator : AbstractValidator<CloseMaintenanceCommand>
{
    public CloseMaintenanceCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
    }
}

public class CloseMaintenanceCommandHandler : IRequestHandler<CloseMaintenanceCommand, Result<MaintenanceLog>>
{
    private readonly IMaintenanceLogRepository _maintenanceRepository;
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CloseMaintenanceCommandHandler(
        IMaintenanceLogRepository maintenanceRepository,
        IVehicleRepository vehicleRepository,
        IUnitOfWork unitOfWork)
    {
        _maintenanceRepository = maintenanceRepository;
        _vehicleRepository = vehicleRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<MaintenanceLog>> Handle(CloseMaintenanceCommand request, CancellationToken cancellationToken)
    {
        var log = await _maintenanceRepository.GetByIdAsync(request.Id, cancellationToken);
        if (log == null)
            return Result<MaintenanceLog>.NotFound("Maintenance log not found.");
        if (log.IsClosed)
            return Result<MaintenanceLog>.Failure("Maintenance is already closed.", 400);

        var vehicle = await _vehicleRepository.GetByIdAsync(log.VehicleId, cancellationToken);
        if (vehicle == null)
            return Result<MaintenanceLog>.NotFound("Vehicle not found.");

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            await _maintenanceRepository.CloseAsync(request.Id, cancellationToken);
            var vehicleUpdated = await _vehicleRepository.SetStatusAsync(log.VehicleId, VehicleStatus.Available, vehicle.Xmin, cancellationToken);
            if (vehicleUpdated == 0)
            {
                await _unitOfWork.RollbackAsync(cancellationToken);
                return Result<MaintenanceLog>.Conflict("Vehicle was modified by another user.");
            }
            await _unitOfWork.CommitAsync(cancellationToken);
            log.IsClosed = true;
            return Result<MaintenanceLog>.Success(log);
        }
        catch
        {
            await _unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
