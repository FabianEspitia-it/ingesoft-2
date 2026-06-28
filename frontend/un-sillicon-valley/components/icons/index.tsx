import type { RemixiconComponentType } from "@remixicon/react";

type IconProps = {
  icon: RemixiconComponentType;
  size?: number | string;
  className?: string;
};

export function Icon({ icon: Component, size = 20, className }: IconProps) {
  return <Component size={size} className={className} aria-hidden />;
}

export {
  RiArrowDownSLine,
  RiArrowRightLine,
  RiChat3Line,
  RiMailCheckLine,
  RiQuillPenLine,
  RiSearchLine,
  RiTrophyLine,
  RiUserLine,
} from "@remixicon/react";
