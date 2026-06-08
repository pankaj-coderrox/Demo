declare module "vanilla-tilt" {
  type TiltTarget = HTMLElement | HTMLElement[];

  interface TiltOptions {
    max?: number;
    speed?: number;
    glare?: boolean;
    "max-glare"?: number;
    perspective?: number;
    scale?: number;
    gyroscope?: boolean;
  }

  const VanillaTilt: {
    init(target: TiltTarget, options?: TiltOptions): void;
  };

  export default VanillaTilt;
}
