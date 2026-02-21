using MediatR;
using feetflow.Domain.Common;
using feetflow.Domain.Entities;
using feetflow.Domain.Interfaces;
using FluentValidation;

namespace feetflow.Application.Features.FleetFlow.Drivers;

public record UpdateDriverCommand(
    Guid Id,
    string FullName,
    string LicenseNumber,
    string LicenseCategory,
    DateOnly LicenseExpiry,
    decimal CompletionRate,
    decimal SafetyScore,
    int Complaints,
    uint Xmin) : IRequest<Result<Driver>>;

public class UpdateDriverCommandValidator : AbstractValidator<UpdateDriverCommand>
{
    public UpdateDriverCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.LicenseNumber).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LicenseCategory).NotEmpty().MaximumLength(50);
        RuleFor(x => x.LicenseExpiry).GreaterThanOrEqualTo(DateOnly.FromDateTime(DateTime.UtcNow));
    }
}

public class UpdateDriverCommandHandler : IRequestHandler<UpdateDriverCommand, Result<Driver>>
{
    private readonly IDriverRepository _driverRepository;

    public UpdateDriverCommandHandler(IDriverRepository driverRepository)
    {
        _driverRepository = driverRepository;
    }

    public async Task<Result<Driver>> Handle(UpdateDriverCommand request, CancellationToken cancellationToken)
    {
        var driver = await _driverRepository.GetByIdAsync(request.Id, cancellationToken);
        if (driver == null)
            return Result<Driver>.NotFound("Driver not found.");

        driver.FullName = request.FullName;
        driver.LicenseNumber = request.LicenseNumber;
        driver.LicenseCategory = request.LicenseCategory;
        driver.LicenseExpiry = request.LicenseExpiry;
        driver.CompletionRate = request.CompletionRate;
        driver.SafetyScore = request.SafetyScore;
        driver.Complaints = request.Complaints;
        driver.Xmin = request.Xmin;

        var updated = await _driverRepository.UpdateAsync(driver, cancellationToken);
        if (updated == 0)
            return Result<Driver>.Conflict("Driver was modified by another user.");
        return Result<Driver>.Success(driver);
    }
}
