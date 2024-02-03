import { useDroppable } from "@dnd-kit/core";
import {
    faArrowLeft,
    faArrowRight,
    faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import JSZip from "jszip";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { GenSetting, History, ImageData } from "../../Type/type";
import ImgThumbnail from "../Parts/ImgThumbnail";
import GenMask from "./GenMask";

type Props = {
    user: string;
    image: ImageData;
    addHistoryFunc: (his: History) => void;
};
type cfgItem = {
    label: string;
    value: number;
};

function Generator(props: Props) {
    const [prepareGen, setPrepareGen] = useState<boolean>(false);
    const [isMask, setIsMask] = useState<boolean>(false);
    const [setting, setSetting] = useState<GenSetting>({
        baseImage: props.image,
        mask: undefined,
        prompt: "",
        cfg: 7,
        cfgLabel: "very small",
        num: 2,
    });
    const [mask, setMask] = useState<ImageData>({
        id: "mask",
        url: "",
        generation: -1,
        label: -1,
    });
    const { isOver, setNodeRef } = useDroppable({
        id: "baseImage",
    });
    const style = isOver
        ? {
              border: "2px solid green",
              backgroundColor: "rgba(0,0,0, 0.05)",
          }
        : undefined;
    const cfgTable = [
        { label: "very small", value: 7 },
        { label: "small", value: 8 },
        { label: "medium", value: 9 },
        { label: "big", value: 10 },
        { label: "very big", value: 11 },
    ];

    useEffect(() => {
        const newSetting = setting;
        newSetting.baseImage = props.image;
        setSetting(newSetting);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.image]);

    function getGenImages() {
        const getGenImagesFunc = async () => {
            const endpoint = process.env.REACT_APP_BASEURL + "/gen-images";
            const params = {
                user: props.user,
                imageId: setting.baseImage.id,
                maskId: mask.id,
                prompt: setting.prompt,
                cfg: String(setting.cfg),
                seed: String(Math.floor(Math.random() * 100) + 1),
                num: String(setting.num),
            };
            const query = new URLSearchParams(params);
            let history: History = {
                id: uuidv4(),
                images: [],
                setting: { ...setting },
            };
            const res = await fetch(endpoint + "?" + query, { method: "GET" });
            if (res.status !== 200) {
                console.error("Failed to gen Images");
                return;
            }
            const zipBlob = await res.blob();
            const jszip = new JSZip();
            const zipData = await jszip.loadAsync(zipBlob);
            await Promise.all(
                Object.keys(zipData.files).map(async (filename: string) => {
                    const path = zipData.files[filename];
                    const regex = /(.*)\/images\/(.*?)\.png/;
                    const match = String(path.name).match(regex);

                    if (match === null) {
                        console.error("Cannot get the file ID");
                        return;
                    }

                    const genImage = await path.async("blob");
                    const genImageURL = URL.createObjectURL(genImage);
                    const image: ImageData = {
                        id: match[2],
                        url: genImageURL,
                        generation: setting.baseImage.generation + 1,
                        label: 0,
                    };
                    history.images.push(image);
                    return;
                })
            );
            props.addHistoryFunc(history);
            setPrepareGen(true);
        };
        getGenImagesFunc();
        setPrepareGen(false);
    }

    return (
        <div>
            <div className="text-lg font-bold">Generate Image</div>
            <div className="flex items-center mb-2 relative">
                <div ref={setNodeRef} style={style} className="relative w-48">
                    <div className="absolute top-0 left-0 right-0 bottom-0 my-auto h-32 text-center text-lg text-gray-800">
                        Drag and Drop <br />
                        Base Image Here <br />
                        or <br />
                        Generate Image <br />
                        only from Prompt
                    </div>
                    <ImgThumbnail
                        info={setting.baseImage}
                        size={192}
                        hoverEnable={true}
                        hoverText="Drag & Drop to Back to Pool"
                        isDraggable={true}
                    />
                </div>
                <div className="mx-2 p-2 relative text-center h-48 flex flex-col justify-between">
                    <div></div>
                    <FontAwesomeIcon icon={faPlus} size="2x" />
                    <div>
                        <div className="flex items-center">
                            <FontAwesomeIcon icon={faArrowLeft} size="sm" />
                            <div className="p-1"></div>
                            <div className="relative">
                                <div className="opacity-30">
                                    <ImgThumbnail
                                        info={setting.baseImage}
                                        size={64}
                                        hoverEnable={false}
                                        isDraggable={false}
                                        hiddenG={true}
                                    />
                                </div>
                                <div className="absolute top-0 left-0 right-0 bottom-0 ">
                                    <ImgThumbnail
                                        info={mask}
                                        size={64}
                                        hoverEnable={false}
                                        isDraggable={false}
                                    />
                                </div>
                            </div>
                        </div>
                        <button
                            className="bg-blue-700 text-white rounded px-2 py-1"
                            onClick={() => {
                                setIsMask(true);
                            }}
                        >
                            Make Mask
                        </button>
                    </div>
                </div>
                <div
                    className={
                        isMask
                            ? "absolute top-0 left-0"
                            : "hidden absolute top-0 left-0"
                    }
                >
                    <GenMask
                        mask={mask}
                        user={props.user}
                        setMaskFunc={setMask}
                        isMaskFunc={setIsMask}
                    />
                </div>
                <table className="text-lg grow">
                    <tbody className="">
                        <tr className="border-2 border-white divide-x-2 divide-white">
                            <td className="p-1 w-48 h-10">Prompt</td>
                            <td>
                                <input
                                    type="text"
                                    className="grow h-10 w-full"
                                    placeholder="prompt"
                                    onChange={(event) => {
                                        const newSetting = setting;
                                        newSetting.prompt = event.target.value;
                                        if (newSetting.prompt !== "") {
                                            setPrepareGen(true);
                                        } else {
                                            setPrepareGen(false);
                                        }
                                        setSetting(newSetting);
                                    }}
                                />
                            </td>
                        </tr>
                        <tr className="border-2 border-white divide-x-2 divide-white">
                            <td className="p-1 h-10 text-sm">
                                How much to change the image (CFG)
                            </td>
                            <td>
                                <select
                                    className="w-48 h-10 bg-white p-2"
                                    onChange={(event) => {
                                        const newSetting = setting;
                                        newSetting.cfg = Number(
                                            event.target.value
                                        );
                                        newSetting.cfgLabel =
                                            event.target.selectedOptions[0].text;
                                        setSetting(newSetting);
                                    }}
                                >
                                    {cfgTable.map((item: cfgItem) => {
                                        return (
                                            <option
                                                key={item.label}
                                                value={item.value}
                                                label={item.label}
                                            >
                                                {item.label}
                                            </option>
                                        );
                                    })}
                                </select>
                            </td>
                        </tr>
                        <tr className="border-2 border-white divide-x-2 divide-white">
                            <td className="text-sm h-10 p-1">
                                Number of <br />
                                Generate Image
                            </td>
                            <td>
                                <input
                                    type="number"
                                    className="w-16 px-2 h-8"
                                    min={1}
                                    max={5}
                                    defaultValue={setting.num}
                                    onChange={(event) => {
                                        const newSetting = setting;
                                        newSetting.num = Number(
                                            event.target.value
                                        );
                                        setSetting(newSetting);
                                    }}
                                />
                                <div className="text-sm">
                                    The less, the shorter  <br />
                                    the generation speed.
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div className="mx-4">
                    <FontAwesomeIcon icon={faArrowRight} size="2x" />
                </div>
                <div>
                    <div className="flex items-center mb-2 border-2 border-white p-1">
                        <div className="font-bold border-r-2 border-white p-2">
                            Ready <br /> State
                        </div>
                        <ul className="ml-8 list-disc">
                            <li
                                className={
                                    setting.prompt
                                        ? "font-bold"
                                        : "text-gray-500"
                                }
                            >
                                Prompt
                            </li>
                            <li
                                className={
                                    setting.baseImage.url
                                        ? "font-bold"
                                        : "text-gray-500"
                                }
                            >
                                Image
                            </li>
                            <li
                                className={
                                    mask.url ? "font-bold" : "text-gray-500"
                                }
                            >
                                Mask
                            </li>
                        </ul>
                    </div>
                    <button
                        className={
                            prepareGen
                                ? "my-auto px-8 py-2 bg-blue-700 text-xl text-white font-bold text-center rounded"
                                : "my-auto px-8 py-2 bg-gray-400 text-xl text-white font-bold text-center rounded"
                        }
                        onClick={() => {
                            if (prepareGen) {
                                getGenImages();
                            } else {
                                alert(
                                    "Fill the prompt or wait for generation."
                                );
                            }
                        }}
                    >
                        Generate <br />
                        <span className="text-sm font-normal">
                            {setting.prompt
                                ? setting.baseImage.url
                                    ? mask.url
                                        ? "Edit a Part of Image"
                                        : "Edit Entire Image"
                                    : "Only by Prompt"
                                : ""}
                        </span>
                    </button>
                </div>
            </div>
            <div className="text-sm mb-2">
                The number in the lower left corner of the image increases as
                the image is generated. <br />G stands for Generation.{" "}
                <span className="px-2 bg-green-700 text-white opacity">
                    G:0
                </span>{" "}
                indicates the input image.{" "}
                <span className="text-yellow-600 font-bold">
                    Keep it small.
                </span>{" "}
            </div>
            {setting.baseImage.generation > 1 && (
                <div className="mb-2 text-red-700">
                    Using images that have been repeatedly edited/generated may
                    distort the training results.
                </div>
            )}
        </div>
    );
}

export default Generator;
