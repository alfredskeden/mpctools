import { Stage, Layer, Image } from "react-konva";

export const KonvaCanvas = ({ image }: { image: CanvasImageSource }) => {
  return (
    <Stage width={744} height={1039}>
      <Layer>
        <Image image={image} width={744} height={1039} alt="test" />
      </Layer>
    </Stage>
  );
};
