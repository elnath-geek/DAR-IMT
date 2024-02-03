import { InitInfo } from "../../Type/type";

type Props = {
    info: InitInfo;
    setInitInfoFunc: (info: InitInfo) => void;
};

function ProjectInit(props: Props) {
    return (
        <div className="p-2 px-4 bg-white text-sm">
            <div className="text-lg font-bold">Project Init</div>
            What object do you change from what state to what state?
            <div className="text-lg">
                <div>
                    What:
                    <input
                        className="w-32"
                        type={"text"}
                        placeholder={"Object Name"}
                        onChange={(event) => {
                            props.setInitInfoFunc({
                                user: props.info.user,
                                object: event.target.value,
                                start: props.info.start,
                                end: props.info.end,
                            });
                        }}
                    />
                </div>
                <div>
                    start:
                    <input
                        className="w-32"
                        type={"text"}
                        placeholder={"Initial State"}
                        onChange={(event) => {
                            props.setInitInfoFunc({
                                user: props.info.user,
                                object: props.info.object,
                                start: event.target.value,
                                end: props.info.end,
                            });
                        }}
                    />
                </div>
                <div>
                    end:
                    <input
                        className="w-32"
                        type={"text"}
                        placeholder={"Last State"}
                        onChange={(event) => {
                            props.setInitInfoFunc({
                                user: props.info.user,
                                object: props.info.object,
                                start: props.info.start,
                                end: event.target.value,
                            });
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

export default ProjectInit;
