using MediatR;
using feetflow.Domain.Common;
using feetflow.Domain.Entities;
using feetflow.Domain.Interfaces;

namespace feetflow.Application.Features.FleetFlow.Drivers;

public record GetDriversQuery(bool IncludeDeleted = false) : IRequest<Result<IReadOnlyList<Driver>>>;

public class GetDriversQueryHandler : IRequestHandler<GetDriversQuery, Result<IReadOnlyList<Driver>>>
{
    private readonly IDriverRepository _driverRepository;

    public GetDriversQueryHandler(IDriverRepository driverRepository)
    {
        _driverRepository = driverRepository;
    }

    public async Task<Result<IReadOnlyList<Driver>>> Handle(GetDriversQuery request, CancellationToken cancellationToken)
    {
        var list = await _driverRepository.GetAllAsync(request.IncludeDeleted, cancellationToken);
        return Result<IReadOnlyList<Driver>>.Success(list);
    }
}
