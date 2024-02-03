import {
    faChevronDown,
    faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

type genSample = {
    img: string
    desc: string
};

function GenSample() {
    const [toggle, setToggle] = useState<Boolean>(true);


    const genSampleImages: genSample[] = [
        {
            img: "/img/GenSample_text.png",
            desc: "・Generate Images only be Prompt."
        }, {
        
            img: "/img/GenSample_CFG.png",
            desc: "・User can adjust how much the image is changed."
        }, {
            img: "/img/GenSample_InstructPix2pix.png",
            desc: "・Entire image can be edited with the base image and prompts"
        }, {
        
            img: "/img/GenSample_Inpaint.png",
            desc: "・Alter only a part of the image using the base image and the corresponding mask."
    }

    ]

    return (
        <div>
            <div className="flex justify-between">
                <button
                    className="text-lg px-2 font-bold"
                    onClick={() => {
                        setToggle(!toggle);
                    }}
                >
                    Generate Samples
                    <span className="font-bold px-4 text-blue-700 underline">
                        {toggle
                            ? "Click to hide samples."
                            : "Click to see some samples."}
                    </span>
                    <span className="text-blue-700">
                        {toggle ? (
                            <FontAwesomeIcon icon={faChevronUp} size="lg" />
                        ) : (
                            <FontAwesomeIcon icon={faChevronDown} size="lg" />
                        )}
                    </span>
                </button>
                {/* <div>See More Sample</div> */}
            </div>
            <div className="flex flex-wrap p-4 pl-0">
                {
                    toggle && genSampleImages.map((item: genSample) => {
                        return (
                            <div className="w-1/2 py-1" key={item.desc}>
                                <div className="font-bold">{item.desc}</div>
                                <img src={item.img} alt="" />
                            </div>
                        )
                    })
                }
            </div>
        </div>
    );
}

export default GenSample;
