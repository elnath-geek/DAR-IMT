import JSZip from "jszip";
import Konva from "konva";
import { KonvaEventObject } from "konva/lib/Node";
import React from "react";
import { Layer, Line, Stage } from "react-konva";
import { v4 as uuidv4 } from "uuid";
import { ImageData } from "../../Type/type";

type Props = {
    mask: ImageData;
    user: string;
    setMaskFunc: (mask: ImageData) => void;
    isMaskFunc: (flag: boolean) => void;
};

type LineItem = {
    tool: string;
    points: number[];
    color: string;
    size: number;
};

function GenMask(props: Props) {
    const color = "#ffffff";
    const [tool, setTool] = React.useState("pen");
    const [size, setSize] = React.useState(15);
    const [lines, setLines] = React.useState<LineItem[]>([]);
    const isDrawing = React.useRef(false);
    const stageRef = React.createRef<Konva.Stage>();

    const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
        isDrawing.current = true;
        const stage = e.target.getStage();
        if (stage === null) return;
        const pos = stage.getPointerPosition();
        if (pos === null) return;
        setLines([
            ...lines,
            {
                tool,
                points: [pos.x, pos.y],
                color,
                size,
            },
        ]);
    };

    const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
        // no drawing - skipping
        if (!isDrawing.current) {
            return;
        }
        const stage = e.currentTarget.getStage();
        if (stage === null) return;
        const point = stage.getPointerPosition();
        if (point === null) return;
        let lastLine = lines[lines.length - 1];
        if (lastLine === undefined) return
        lastLine.points = lastLine.points.concat([point.x, point.y]);
        lines.splice(lines.length - 1, 1, lastLine);
        setLines(lines.concat());
    };

    const handleMouseUp = () => {
        isDrawing.current = false;
    };

    const maskConfirm = () => {
        if (lines.length > 0) {
            const url = stageRef.current?.getStage().toDataURL({
                mimeType: "image/png",
                quality: 1.0,
            });
            const newMask: ImageData = {
                id: uuidv4(),
                url: url || "",
                generation: -1,
                label: -1,
            };
            props.setMaskFunc(newMask);
            uploadImages(newMask);
        } else {
            const clearMask: ImageData = {
                id: "mask",
                url: "",
                generation: -1,
                label: -1,
            };
            props.setMaskFunc(clearMask);
        }
        props.isMaskFunc(false);
    };

    async function uploadImages(newMask: ImageData) {
        const zip = new JSZip();
        const file_name = newMask.id + ".png";
        stageRef.current?.getStage().toBlob({
            callback(maskBlob) {
                if (!maskBlob) return;
                zip.file(file_name, maskBlob);
                zip.generateAsync({ type: "blob" }).then(async (blob) => {
                    const formData = new FormData();
                    formData.append("file", blob, props.user + ".zip");

                    const endpoint =
                        process.env.REACT_APP_BASEURL + "/upload-images";
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
            },
        });
    }

    return (
        <div className="flex">
            <Stage
                width={192}
                height={192}
                onMouseDown={handleMouseDown}
                onMousemove={handleMouseMove}
                onMouseup={handleMouseUp}
                style={{
                    border: "solid",
                    height: 192,
                    width: 192,
                }}
                ref={stageRef}
            >
                <Layer>
                    {lines.map((line, i) => (
                        <Line
                            key={i}
                            points={line.points}
                            stroke={line.color}
                            strokeWidth={line.size}
                            tension={0.5}
                            lineCap="round"
                            globalCompositeOperation={
                                line.tool === "eraser"
                                    ? "destination-out"
                                    : "source-over"
                            }
                        />
                    ))}
                </Layer>
            </Stage>
            <div className="h-48 flex flex-col p-2 bg-gray-100 ">
                <span className="font-bold">
                    Fill in the area to be changed with white.
                </span>
                <div className="flex my-2">
                    Tool:
                    <select
                        value={tool}
                        className="mx-2 mr-4 w-20"
                        onChange={(e) => {
                            setTool(e.target.value);
                        }}
                    >
                        <option value="pen">pen</option>
                        <option value="eraser">eraser</option>
                    </select>
                    Size:
                    <select
                        value={size}
                        className="mx-2 mr-8 w-12"
                        onChange={(e) => {
                            setSize(Number(e.target.value));
                        }}
                    >
                        <option value="3">3</option>
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="15">15</option>
                        <option value="20">20</option>
                        <option value="30">30</option>
                    </select>
                </div>
                <div className="grow"></div>
                <button
                    id="clear"
                    className="p-1 bg-red-700 text-white rounded"
                    onClick={() => {
                        setLines([]);
                    }}
                >
                    Clear Mask
                </button>
                <div className="grow"></div>
                <button
                    className="p-1 bg-blue-700 text-white rounded"
                    onClick={() => {
                        maskConfirm();
                    }}
                >
                    Confirm
                </button>
            </div>
        </div>
    );
}
export default GenMask;
