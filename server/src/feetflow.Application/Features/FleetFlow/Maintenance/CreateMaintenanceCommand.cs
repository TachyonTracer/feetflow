using MediatR;
using feetflow.Domain.Common;
using feetflow.Domain.Entities;
using feetflow.Domain.Enums;
using feetflow.Domain.Interfaces;
using FluentValidation;

namespace feetflow.Application.Features.FleetFlow.Maintenance;

public record CreateMaintenanceCommand(Guid VehicleId, string Description, decimal Cost, DateOnly ServiceDate) : IRequest<Result<MaintenanceLog>>;

public class CreateMaintenanceCommandValidator : AbstractValidator<CreateMaintenanceCommand>
{
    public CreateMaintenanceCommandValidator()
    {
        RuleFor(x => x.VehicleId).NotEmpty();
        RuleFor(x => x.Description).NotEmpty();
        RuleFor(x => x.Cost).GreaterThanOrEqualTo(0);
        RuleFor(x => x.ServiceDate).NotEmpty();
    }
}

public class CreateMaintenanceCommandHandler : IRequestHandler<CreateMaintenanceCommand, Result<MaintenanceLog>>
{
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IMaintenanceLogRepository _maintenanceRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateMaintenanceCommandHandler(
        IVehicleRepository vehicleRepository,
        IMaintenanceLogRepository maintenanceRepository,
        IUnitOfWork unitOfWork)
    {
        _vehicleRepository = vehicleRepository;
        _maintenanceRepository = maintenanceRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<MaintenanceLog>> Handle(CreateMaintenanceCommand request, CancellationToken cancellationToken)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(request.VehicleId, cancellationToken);
        if (vehicle == null)
            return Result<MaintenanceLog>.NotFound("Vehicle not found.");

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var log = new MaintenanceLog
            {
                Id = Guid.NewGuid(),
                VehicleId = request.VehicleId,
                Description = request.Description,
                Cost = request.Cost,
                ServiceDate = request.ServiceDate,
                IsClosed = false,
                CreatedAt = DateTime.UtcNow
            };
            await _maintenanceRepository.AddAsync(log, cancellationToken);
            var updated = await _vehicleRepository.SetStatusAsync(request.VehicleId, VehicleStatus.InShop, vehicle.Xmin, cancellationToken);
            if (updated == 0)
            {
                await _unitOfWork.RollbackAsync(cancellationToken);
                return Result<MaintenanceLog>.Conflict("Vehicle was modified by another user.");
            }
            await _unitOfWork.CommitAsync(cancellationToken);
            return Result<MaintenanceLog>.Created(log);
        }
        catch
        {
            await _unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
