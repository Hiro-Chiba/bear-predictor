interface SectionHeadingProps {
  readonly title: string;
  readonly description?: string;
}

export function SectionHeading({ title, description }: SectionHeadingProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">{title}</h2>
      {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
    </div>
  );
}
