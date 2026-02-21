namespace feetflow.Domain.Entities;

using feetflow.Domain.Enums;

public class SampleEntity : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public SampleType Type { get; set; } = SampleType.Default;
}
