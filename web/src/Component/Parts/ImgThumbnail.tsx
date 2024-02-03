import { useDraggable } from "@dnd-kit/core";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { ImageData } from "../../Type/type";

type Props = {
    info: ImageData;
    size: number;
    hoverEnable: boolean;
    hoverText?: string;
    buttonText?: string;
    isDraggable: boolean;
    hiddenG?: boolean;
};

function ImgThumbnail(props: Props) {
    const [selector, setSelector] = useState(false);
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: uuidv4().slice(0, 3) + "-" + props.info?.id,
    });
    const style = transform
        ? {
              transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          }
        : undefined;

    const content = (
        <>
            <img
                className="object-cover"
                src={props.info.url}
                alt=""
                width={props.size}
                height={props.size}
            />
            {props.info.generation >= 0 && !props.hiddenG && (
                <div
                    className={
                        props.info.generation === 0
                            ? "absolute bg-green-800 text-white p-2 bottom-0 left-0 text-sm opacity-70"
                            : props.info.generation === 1
                            ? "absolute bg-yellow-800 text-white p-2 bottom-0 left-0 text-sm opacity-70"
                            : "absolute bg-red-800 text-white p-2 bottom-0 left-0 text-sm opacity-70"
                    }
                >
                    G:{props.info.generation}
                </div>
            )}
            {props.info.url && selector && props.hoverEnable && (
                <div className="flex flex-col justify-around p-2 bg-white/50 text-lg text-center absolute top-0 left-0 right-0 bottom-0">
                    {props.hoverText}
                    {props.buttonText && (
                        <button className="bg-gray-700 text-white p-2">
                            {props.buttonText}
                        </button>
                    )}
                </div>
            )}
        </>
    );

    return (
        <>
            {props.isDraggable && (
                <div
                    className="relative drop-shadow"
                    onMouseEnter={() => setSelector(true)}
                    onMouseLeave={() => setSelector(false)}
                    ref={props.isDraggable ? setNodeRef : null}
                    style={props.isDraggable ? style : undefined}
                    {...listeners}
                    {...attributes}
                >
                    {content}
                </div>
            )}
            {!props.isDraggable && (
                <div
                    className="relative drop-shadow"
                    onMouseEnter={() => setSelector(true)}
                    onMouseLeave={() => setSelector(false)}
                >
                    {content}
                </div>
            )}
        </>
    );
}

export default ImgThumbnail;
