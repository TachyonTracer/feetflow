using MediatR;
using feetflow.Application.Common;
using feetflow.Domain.Common;
using feetflow.Domain.Entities;
using feetflow.Domain.Interfaces;

namespace feetflow.Application.Features.FleetFlow.Drivers;

public record GetDriversPagedQuery(int PageNumber = 1, int PageSize = 10, bool IncludeDeleted = false) : IRequest<Result<PagedResult<Driver>>>;

public class GetDriversPagedQueryHandler : IRequestHandler<GetDriversPagedQuery, Result<PagedResult<Driver>>>
{
    private readonly IDriverRepository _driverRepository;

    public GetDriversPagedQueryHandler(IDriverRepository driverRepository)
    {
        _driverRepository = driverRepository;
    }

    public async Task<Result<PagedResult<Driver>>> Handle(GetDriversPagedQuery request, CancellationToken cancellationToken)
    {
        var (pageNumber, pageSize) = PaginationHelper.Normalize(request.PageNumber, request.PageSize);

        var items = await _driverRepository.GetPagedAsync(pageNumber, pageSize, request.IncludeDeleted, cancellationToken);
        var total = await _driverRepository.CountAsync(request.IncludeDeleted, cancellationToken);
        return Result<PagedResult<Driver>>.Success(new PagedResult<Driver>(items, total, pageNumber, pageSize));
    }
}
