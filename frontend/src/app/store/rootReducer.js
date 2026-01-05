import { ACTIONS } from "./actions";

export const initialState = {
  loading: false,
  error: null,

  auth: {
    token: localStorage.getItem("token"),
    admin: null,
  },

  employees: [],
  salaries: [],
  promotions: [],
  credentials: [],
  employments: [],
  leaveCredits: [],
  leaveRequests: []





};

export function rootReducer(state, action) {
  switch (action.type) {
    // UI state
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };

    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };

    // Auth state
    case ACTIONS.AUTH_SET:
      return {
        ...state,
        auth: {
          token: action.payload.token,
          admin: action.payload.admin,
        },
      };

    case ACTIONS.AUTH_LOGOUT:
      return {
        ...state,
        auth: { token: null, admin: null },
      };

    // Employees state
    case ACTIONS.EMPLOYEES_SET:
      return { ...state, employees: action.payload };

    case ACTIONS.EMPLOYEE_ADD:
      return { ...state, employees: [action.payload, ...state.employees] };

    case ACTIONS.EMPLOYEE_UPDATE:
      return {
        ...state,
        employees: state.employees.map((e) =>
          e._id === action.payload._id ? action.payload : e
        ),
      };

    case ACTIONS.EMPLOYEE_REMOVE:
      return {
        ...state,
        employees: state.employees.filter((e) => e._id !== action.payload),
      };

    //   Salary State
    case ACTIONS.SALARIES_SET:
      return { ...state, salaries: action.payload };

    case ACTIONS.SALARY_ADD:
      return { ...state, salaries: [action.payload, ...state.salaries] };

    case ACTIONS.PROMOTIONS_SET:
      return { ...state, promotions: action.payload };

    case ACTIONS.PROMOTION_ADD:
      return { ...state, promotions: [action.payload, ...state.promotions] };


    //   credential state

    case ACTIONS.CREDENTIAL_SET:
        return { ...state, credentials: action.payload };

    case ACTIONS.CREDENTIAL_ADD:
        return { ...state, credentials: [action.payload, ...state.credentials] };


    //  employment status
    
    case ACTIONS.EMPLOYMENTS_SET:
        return { ...state, employments: action.payload };

    case ACTIONS.EMPLOYMENT_ADD:
        return { ...state, employments: [action.payload, ...state.employments] };

    // Leave credits

    case ACTIONS.LEAVE_CREDITS_SET:
        return { ...state, leaveCredits: action.payload };

    case ACTIONS.LEAVE_CREDIT_UPSERT: {
        const incoming = action.payload;
        const exists = state.leaveCredits.some(
        (c) =>
        String(c._id) === String(incoming._id) ||
        (String(c.employeeId) === String(incoming.employeeId) &&
        Number(c.year) === Number(incoming.year))
       );

        return {
          ...state,
          leaveCredits: exists
           ? state.leaveCredits.map((c) =>
          String(c._id) === String(incoming._id) ||
          (String(c.employeeId) === String(incoming.employeeId) &&
            Number(c.year) === Number(incoming.year))
            ? incoming
            : c
           )
      : [incoming, ...state.leaveCredits],
   };
  }

    case ACTIONS.LEAVE_REQUESTS_SET:
        return { ...state, leaveRequests: action.payload };

    case ACTIONS.LEAVE_REQUEST_ADD:
        return { ...state, leaveRequests: [action.payload, ...state.leaveRequests] };

    case ACTIONS.LEAVE_REQUEST_UPDATE:
        return {
        ...state,
        leaveRequests: state.leaveRequests.map((r) =>
         r._id === action.payload._id ? action.payload : r
      ),
    };

    case ACTIONS.LEAVE_REQUEST_UPDATE:
        return {
        ...state,
        leaveRequests: state.leaveRequests.map((r) =>
         r._id === action.payload._id ? action.payload : r
      ),
   };





    default:
      return state;
  }
}
