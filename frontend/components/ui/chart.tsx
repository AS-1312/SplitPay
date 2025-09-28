'use client''use client''use client''use client'



import * as React from 'react'

import { cn } from '@/lib/utils'

import * as React from 'react'

export interface ChartConfig {

  [key: string]: anyimport { cn } from '@/lib/utils'

}

import * as React from 'react'import * as React from 'react'

export const ChartContainer = React.forwardRef<

  HTMLDivElement,// Placeholder chart components for build compatibility

  React.ComponentProps<'div'> & {

    config: ChartConfigexport interface ChartConfig {import * as RechartsPrimitive from 'recharts'

    children: React.ReactNode

  }  [key: string]: any

>(({ className, children, ...props }, ref) => (

  <div ref={ref} className={cn('w-full h-full', className)} {...props}>}import { cn } from '@/lib/utils'

    {children}

  </div>

))

ChartContainer.displayName = 'ChartContainer'export const ChartContainer = React.forwardRef<import { cn } from '@/lib/utils'



export const ChartTooltip = ({ children }: { children?: React.ReactNode }) => (  HTMLDivElement,

  <div>{children}</div>

)  React.ComponentProps<'div'> & {// Placeholder chart components for build compatibility



export const ChartTooltipContent = ({ className, ...props }: any) => (    config: ChartConfig

  <div className={cn('p-2 rounded border bg-background shadow', className)} {...props} />

)    children: React.ReactNode// These can be properly implemented later if needed// Format: { THEME_NAME: CSS_SELECTOR }



export const ChartLegend = ({ children }: { children?: React.ReactNode }) => (  }

  <div>{children}</div>

)>(({ className, config, children, ...props }, ref) => {const THEMES = { light: '', dark: '.dark' } as const



export const ChartLegendContent = ({ className, ...props }: any) => (  return (

  <div className={cn('flex items-center gap-2', className)} {...props} />

)    <div ref={ref} className={cn('w-full h-full', className)} {...props}>export interface ChartConfig {

      {children}

    </div>  [key: string]: anyexport type ChartConfig = {

  )

})}  [k in string]: {

ChartContainer.displayName = 'ChartContainer'

    label?: React.ReactNode

export const ChartTooltip = ({ children }: { children?: React.ReactNode }) => {

  return <div>{children}</div>export const ChartContainer = React.forwardRef<    icon?: React.ComponentType

}

  HTMLDivElement,  } & (

export const ChartTooltipContent = ({ className, ...props }: any) => {

  return <div className={cn('rounded-lg border bg-background p-2 shadow-md', className)} {...props} />  React.ComponentProps<'div'> & {    | { color?: string; theme?: never }

}

    config: ChartConfig    | { color?: never; theme: Record<keyof typeof THEMES, string> }

export const ChartLegend = ({ children }: { children?: React.ReactNode }) => {

  return <div>{children}</div>    children: React.ComponentProps<'div'>['children']  )

}

  }}

export const ChartLegendContent = ({ className, ...props }: any) => {

  return <div className={cn('flex items-center gap-2', className)} {...props} />>(({ className, config, children, ...props }, ref) => {

}
  return (type ChartContextProps = {

    <div ref={ref} className={cn('w-full h-full', className)} {...props}>  config: ChartConfig

      {children}}

    </div>

  )const ChartContext = React.createContext<ChartContextProps | null>(null)

})

ChartContainer.displayName = 'ChartContainer'function useChart() {

  const context = React.useContext(ChartContext)

export const ChartTooltip = ({ children }: { children?: React.ReactNode }) => {

  return <div>{children}</div>  if (!context) {

}    throw new Error('useChart must be used within a <ChartContainer />')

  }

export const ChartTooltipContent = ({ className, ...props }: any) => {

  return <div className={cn('rounded-lg border bg-background p-2 shadow-md', className)} {...props} />  return context

}}



export const ChartLegend = ({ children }: { children?: React.ReactNode }) => {function ChartContainer({

  return <div>{children}</div>  id,

}  className,

  children,

export const ChartLegendContent = ({ className, ...props }: any) => {  config,

  return <div className={cn('flex items-center gap-2', className)} {...props} />  ...props

}}: React.ComponentProps<'div'> & {
  config: ChartConfig
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >['children']
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border flex aspect-video justify-center text-xs [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme || config.color,
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join('\n')}
}
`,
          )
          .join('\n'),
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = 'dot',
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}: any) {
}: React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
  React.ComponentProps<'div'> & {
    hideLabel?: boolean
    hideIndicator?: boolean
    indicator?: 'line' | 'dot' | 'dashed'
    nameKey?: string
    labelKey?: string
  }) {
  const { config } = useChart()

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null
    }

    const [item] = payload
    const key = `${labelKey || item?.dataKey || item?.name || 'value'}`
    const itemConfig = getPayloadConfigFromPayload(config, item, key)
    const value =
      !labelKey && typeof label === 'string'
        ? config[label as keyof typeof config]?.label || label
        : itemConfig?.label

    if (labelFormatter) {
      return (
        <div className={cn('font-medium', labelClassName)}>
          {labelFormatter(value, payload)}
        </div>
      )
    }

    if (!value) {
      return null
    }

    return <div className={cn('font-medium', labelClassName)}>{value}</div>
  }, [
    label,
    labelFormatter,
    payload,
    hideLabel,
    labelClassName,
    config,
    labelKey,
  ])

  if (!active || !payload?.length) {
    return null
  }

  const nestLabel = payload.length === 1 && indicator !== 'dot'

  return (
    <div
      className={cn(
        'border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl',
        className,
      )}
    >
      {!nestLabel ? tooltipLabel : null}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = `${nameKey || item.name || item.dataKey || 'value'}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)
          const indicatorColor = color || item.payload.fill || item.color

          return (
            <div
              key={item.dataKey}
              className={cn(
                '[&>svg]:text-muted-foreground flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5',
                indicator === 'dot' && 'items-center',
              )}
            >
              {formatter && item?.value !== undefined && item.name ? (
                formatter(item.value, item.name, item, index, item.payload)
              ) : (
                <>
                  {itemConfig?.icon ? (
                    <itemConfig.icon />
                  ) : (
                    !hideIndicator && (
                      <div
                        className={cn(
                          'shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)',
                          {
                            'h-2.5 w-2.5': indicator === 'dot',
                            'w-1': indicator === 'line',
                            'w-0 border-[1.5px] border-dashed bg-transparent':
                              indicator === 'dashed',
                            'my-0.5': nestLabel && indicator === 'dashed',
                          },
                        )}
                        style={
                          {
                            '--color-bg': indicatorColor,
                            '--color-border': indicatorColor,
                          } as React.CSSProperties
                        }
                      />
                    )
                  )}
                  <div
                    className={cn(
                      'flex flex-1 justify-between leading-none',
                      nestLabel ? 'items-end' : 'items-center',
                    )}
                  >
                    <div className="grid gap-1.5">
                      {nestLabel ? tooltipLabel : null}
                      <span className="text-muted-foreground">
                        {itemConfig?.label || item.name}
                      </span>
                    </div>
                    {item.value && (
                      <span className="text-foreground font-mono font-medium tabular-nums">
                        {item.value.toLocaleString()}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const ChartLegend = RechartsPrimitive.Legend

function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = 'bottom',
  nameKey,
}: React.ComponentProps<'div'> &
  Pick<RechartsPrimitive.LegendProps, 'payload' | 'verticalAlign'> & {
    hideIcon?: boolean
    nameKey?: string
  }) {
  const { config } = useChart()

  if (!payload?.length) {
    return null
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-4',
        verticalAlign === 'top' ? 'pb-3' : 'pt-3',
        className,
      )}
    >
      {payload.map((item) => {
        const key = `${nameKey || item.dataKey || 'value'}`
        const itemConfig = getPayloadConfigFromPayload(config, item, key)

        return (
          <div
            key={item.value}
            className={
              '[&>svg]:text-muted-foreground flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3'
            }
          >
            {itemConfig?.icon && !hideIcon ? (
              <itemConfig.icon />
            ) : (
              <div
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{
                  backgroundColor: item.color,
                }}
              />
            )}
            {itemConfig?.label}
          </div>
        )
      })}
    </div>
  )
}

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string,
) {
  if (typeof payload !== 'object' || payload === null) {
    return undefined
  }

  const payloadPayload =
    'payload' in payload &&
    typeof payload.payload === 'object' &&
    payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === 'string'
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === 'string'
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config]
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}
