import { useDroppable } from "@dnd-kit/core";
import {
    faArrowUpFromBracket,
    faPlus,
    faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import JSZip from "jszip";
import { v4 as uuidv4 } from "uuid";
import { ImageData } from "../../Type/type";
import ImgThumbnail from "../Parts/ImgThumbnail";

type Props = {
    user: string;
    images: ImageData[];
    addImageFunc: (image: ImageData[]) => void;
    startGenerateFunc: (flag: boolean) => void;
};

function ImagePool(props: Props) {
    const { isOver, setNodeRef } = useDroppable({
        id: "droppable-0",
    });
    const style = isOver
        ? {
              border: "2px solid green",
              backgroundColor: "rgba(0,0,0, 0.05)",
          }
        : undefined;

    const trash = useDroppable({
        id: "trash",
    });
    const style_trash = trash.isOver
        ? {
              border: "2px solid green",
              backgroundColor: "rgba(0,0,0, 0.05)",
          }
        : undefined;

    const inputId = Math.random().toString(32).substring(2);

    const handleOnAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const files = e.target.files;
        const images: ImageData[] = [];
        const zip = new JSZip();

        for (let i = 0; i < files.length; i++) {
            const imageURL = URL.createObjectURL(files[i]);
            const image: ImageData = {
                id: uuidv4(),
                url: imageURL,
                generation: 0,
                label: 0,
            };
            images.push(image);
            const file_name = image.id + files[i].name.slice(-4);
            zip.file(file_name, files[i]);
        }
        props.addImageFunc(images);
        uploadImages(zip);
    };

    async function uploadImages(zip: JSZip) {
        zip.generateAsync({ type: "blob" }).then(async (blob) => {
            const formData = new FormData();
            formData.append("file", blob, props.user + ".zip");

            const endpoint = process.env.REACT_APP_BASEURL + "/upload-images";
            try {
                // Fetch API を使用してサーバーにファイルを送信
                const response = await fetch(endpoint, {
                    method: "POST",
                    body: formData,
                });

                // サーバーからの応答を処理
                if (!response.ok) {
                    console.error("アップロードが失敗しました。");
                }
            } catch (error) {
                console.error("エラー:", error);
            }
        });
    }

    const handleDrop = (e: any) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        const images: ImageData[] = [];
        const zip = new JSZip();

        for (let i = 0; i < files.length; i++) {
            const imageURL = URL.createObjectURL(files[i]);
            const image: ImageData = {
                id: uuidv4(),
                url: imageURL,
                generation: 0,
                label: 0,
            };
            images.push(image);
            const file_name = image.id + files[i].name.slice(-4);
            zip.file(file_name, files[i]);
        }
        props.addImageFunc(images);
        uploadImages(zip);
    };

    const handleDragOver = (e: any) => {
        e.preventDefault();
    };

    return (
        <div className="h-full flex flex-col">
            <div className="mt-2 text-lg font-bold">Image Pool</div>
            <div className="grow px-2 pt-2 border-4 divide-y-2 h-full flex flex-col overflow-y-scroll">
                <div className="flex divide-x-2 mb-2">
                    <div className="basis-1/2">
                        <label htmlFor={inputId}>
                            <div className="p-2 text-sm text-center text-gray-500 cursor-pointer">
                                <FontAwesomeIcon
                                    icon={faArrowUpFromBracket}
                                    size="2x"
                                />
                                <div className="mt-2">
                                    Add Images from your PC
                                </div>
                            </div>
                            <input
                                id={inputId}
                                type="file"
                                multiple
                                accept="image/*,.png,.jpg,.jpeg,.gif"
                                onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>
                                ) => handleOnAddImage(e)}
                                style={{ display: "none" }}
                            />
                        </label>
                    </div>
                    <div
                        onClick={() => props.startGenerateFunc(true)}
                        className="basis-1/2"
                    >
                        <div className="p-2 text-sm text-center text-gray-500 cursor-pointer">
                            <FontAwesomeIcon icon={faPlus} size="2x" />
                            <div className="pt-2">Generate Images</div>
                        </div>
                    </div>
                </div>
                <div
                    className="flex flex-wrap flex-add content-start justify-between p-2 h-full overflow-x-hidden"
                    ref={setNodeRef}
                    style={style}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                >
                    {props.images[0] &&
                        props.images
                            .filter((image: ImageData) => {
                                return image.label === 0;
                            })
                            .map((image: ImageData) => {
                                return (
                                    <div key={"imagepool-" + image.id}>
                                        <ImgThumbnail
                                            info={image}
                                            size={144}
                                            hoverEnable={true}
                                            hoverText="Drag & Drop for Labeling"
                                            isDraggable={true}
                                        />
                                    </div>
                                );
                            })}
                    {!props.images[0] && (
                        <div className="text-gray-400 text-xl text-center mx-auto py-4">
                            Add or Make Images <br />
                            from + Button <br />
                            {/* and Label the Image <br />
                        by Drag and Drop */}
                        </div>
                    )}
                </div>
                <div
                    ref={trash.setNodeRef}
                    style={style_trash}
                    className="p-2 text-gray-500 text-center"
                >
                    <span className="pr-4">
                        <FontAwesomeIcon icon={faTrash} />
                    </span>
                    Remove the Image{" "}
                </div>
            </div>
        </div>
    );
}

export default ImagePool;
