import { Fragment } from "react";
import "./toolbar.css";

const Toolbar = ({
  onDuplicate,
  onDelete,
}: {
  onDuplicate?: any;
  onDelete?: any;
  onEdit?: any;
}) => {
  return (
    <Fragment>
      <div className="aplus-content-toolbar">
        {/* <button> */}
        <svg
          onClick={onDuplicate}
          xmlns="http://www.w3.org/2000/svg"
          width="25"
          height="25"
          viewBox="0 0 25 25"
          fill="none"
        >
          <path
            d="M5.6893 15.706H4.6893C4.15887 15.706 3.65016 15.4953 3.27509 15.1202C2.90001 14.7451 2.6893 14.2364 2.6893 13.706V4.70599C2.6893 4.17556 2.90001 3.66685 3.27509 3.29178C3.65016 2.91671 4.15887 2.70599 4.6893 2.70599H13.6893C14.2197 2.70599 14.7284 2.91671 15.1035 3.29178C15.4786 3.66685 15.6893 4.17556 15.6893 4.70599V5.70599"
            stroke="black"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M21.4444 9H10.5556C9.69645 9 9 9.69645 9 10.5556V21.4444C9 22.3036 9.69645 23 10.5556 23H21.4444C22.3036 23 23 22.3036 23 21.4444V10.5556C23 9.69645 22.3036 9 21.4444 9Z"
            stroke="black"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M16 13V19"
            stroke="black"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M13 16H19"
            stroke="black"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        {/* </button> */}

        {/* <button> */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          onClick={onDelete}
        >
          <path
            d="M3 6H5H21"
            stroke="black"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6"
            stroke="black"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M10 11V17"
            stroke="black"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M14 11V17"
            stroke="black"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        {/* </button> */}

        {/* <svg
          width="25"
          onClick={onEdit}
          height="25"
          viewBox="0 0 25 25"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M17.9453 3.20746C18.208 2.94481 18.5198 2.73647 18.863 2.59433C19.2061 2.45219 19.5739 2.37903 19.9453 2.37903C20.3168 2.37903 20.6846 2.45219 21.0277 2.59433C21.3709 2.73647 21.6827 2.94481 21.9453 3.20746C22.208 3.4701 22.4163 3.7819 22.5585 4.12506C22.7006 4.46822 22.7738 4.83602 22.7738 5.20746C22.7738 5.57889 22.7006 5.94669 22.5585 6.28985C22.4163 6.63301 22.208 6.94481 21.9453 7.20746L8.44534 20.7075L2.94534 22.2075L4.44534 16.7075L17.9453 3.20746Z"
            stroke="black"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg> */}
      </div>
    </Fragment>
  );
};

export default Toolbar;
