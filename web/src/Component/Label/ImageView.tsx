import { useDroppable } from "@dnd-kit/core";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ImageData } from "../../Type/type";
import ImgThumbnail from "../Parts/ImgThumbnail";

type Props = {
    steps: number;
    images: ImageData[];
    selectedArea: number;
    isTest: boolean;
    deleteLabelFunc: (idx: number) => void;
};

function ImageView(props: Props) {
    const { isOver, setNodeRef } = useDroppable({
        id: "droppable-" + props.selectedArea,
    });
    const style = isOver
        ? {
              border: "2px solid green",
              backgroundColor: "rgba(0,0,0, 0.05)",
          }
        : undefined;

    return (
        <div
            key={"imageview-" + props.selectedArea}
            className="p-2 h-full overflow-x-hidden"
            ref={props.isTest ? undefined : setNodeRef}
            style={props.isTest ? undefined : style}
        >
            <div className="flex justify-between ">
                <div className="px-2"></div>
                <div className="text-lg text-center mb-3">
                    Label: {props.selectedArea}
                </div>
                <div
                    className="px-2 pb-1 cursor-pointer"
                    onClick={() => {
                        if (
                            window.confirm(
                                "Do you really want to remove this label?"
                            )
                        ) {
                            props.deleteLabelFunc(props.selectedArea);
                        }
                    }}
                >
                    <FontAwesomeIcon icon={faTrash} />
                </div>
            </div>
            <div className="flex flex-wrap flex-add justify-between">
                {(() => {
                    const ret = [];
                    const filteredImages = props.images.filter(
                        (image: ImageData) => {
                            return image.label === props.selectedArea;
                        }
                    );
                    if (filteredImages.length === 0) {
                        ret.push(
                            <div
                                key={"imageview-empty"}
                                className="text-center text-gray-400 text-xl mx-auto py-4"
                            >
                                To Label an Image,
                                <br /> Drag and Drop It Here!
                            </div>
                        );
                    } else {
                        // eslint-disable-next-line array-callback-return
                        filteredImages.map((image: ImageData) => {
                            ret.push(
                                <div key={"imageview-" + image.id}>
                                    <ImgThumbnail
                                        info={image}
                                        size={96}
                                        hoverEnable={true}
                                        hoverText="Drag & Drop for Labeling"
                                        isDraggable={true}
                                    />
                                </div>
                            );
                        });
                    }
                    return ret;
                })()}
            </div>
        </div>
    );
}

export default ImageView;
